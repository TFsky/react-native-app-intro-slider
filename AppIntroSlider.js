import React from 'react';
import {
  StyleSheet,
  FlatList,
  View,
  Dimensions,
  Text,
  TouchableOpacity,
  Platform,
  StatusBar,
  PanResponder,
} from 'react-native';
import DefaultSlide from './DefaultSlide';

const { width, height } = Dimensions.get('window');

const isIphoneX = (
  Platform.OS === 'ios' &&
  !Platform.isPad &&
  !Platform.isTVOS &&
  (height === 812 || width === 812)
);

export default class AppIntroSlider extends React.Component {
  static defaultProps = {
    activeDotColor: 'rgba(255, 255, 255, .9)',
    dotColor: 'rgba(0, 0, 0, .2)',
    skipLabel: 'Skip',
    doneLabel: 'Done',
    nextLabel: 'Next',
  }
  state = {
    width,
    height,
    activeIndex: 0,
  };
  componentWillMount() {
      this._panResponder = PanResponder.create({
          // 要求成为响应者：
          onStartShouldSetPanResponder: (evt, gestureState) => true,
          onStartShouldSetPanResponderCapture: (evt, gestureState) => true,
          onMoveShouldSetPanResponder: (evt, gestureState) => true,
          onMoveShouldSetPanResponderCapture: (evt, gestureState) => true,

          onPanResponderGrant: (evt, gestureState) => {
              // 开始手势操作。给用户一些视觉反馈，让他们知道发生了什么事情！

              // gestureState.{x,y} 现在会被设置为0
              this.props.onStartMove && this.props.onStartMove(evt, gestureState);
          },
          onPanResponderMove: (evt, gestureState) => {
              // 最近一次的移动距离为gestureState.move{X,Y}
              this.props.onMove && this.props.onMove(evt, gestureState);
              // 从成为响应者开始时的累计手势移动距离为gestureState.d{x,y}
              if(this.state.activeIndex ==  this.props.slides.length - 1 && gestureState.dx<0){
                this.props.onSlidingInLastPage &&  this.props.onSlidingInLastPage(evt, gestureState);
              }
          },
          onPanResponderTerminationRequest: (evt, gestureState) => true,
          onPanResponderRelease: (evt, gestureState) => {
              // 用户放开了所有的触摸点，且此时视图已经成为了响应者。
              // 一般来说这意味着一个手势操作已经成功完成。
              this.props.onStopMove && this.props.onStopMove(evt, gestureState);
              if(this.state.activeIndex ==  this.props.slides.length - 1 && gestureState.dx<0){
                  this.props.onSlidingInLastPage &&  this.props.onSlidingInLastPage(evt, gestureState);
              }
          },
          onPanResponderTerminate: (evt, gestureState) => {
              // 另一个组件已经成为了新的响应者，所以当前手势将被取消。
          },
          onShouldBlockNativeResponder: (evt, gestureState) => {
              // 返回一个布尔值，决定当前组件是否应该阻止原生组件成为JS响应者
              // 默认返回true。目前暂时只支持android。
              return true;
          },
      });
  }
  goToSlide = (pageNum) => {
    this.setState({ activeIndex: pageNum });
    this.flatList.scrollToOffset({ offset: pageNum * this.state.width });
  }

  _onNextPress = () => {
    this.goToSlide(this.state.activeIndex + 1);
    this.props.onSlideChange && this.props.onSlideChange(this.state.activeIndex + 1, this.state.activeIndex);
  }

  _renderItem = (item) => {
    const { width, height } = this.state;
    const bottomSpacer = (this.props.bottomButton ? (this.props.showSkipButton ? 44 : 0) + 44 : 0) + (isIphoneX ? 34: 0) + 64;
    const topSpacer = (isIphoneX ? 44 : 0) + (Platform.OS === 'ios' ? 20 : StatusBar.currentHeight);
    const props = { ...item.item, bottomSpacer, topSpacer };
    return (
      <View style={{ height, width }}>
        {this.props.renderItem ? this.props.renderItem(props) : (
          <DefaultSlide {...props}/>
        )}
      </View>
    );
  }

  _renderButton = (content, onPress, isSkip) => {
    if (isSkip && !this.props.bottomButton && this.state.activeIndex == this.props.slides.length - 1) {
      return null;
    }
    let style = isSkip ? styles.leftButtonContainer : styles.rightButtonContainer;
    if (this.props.bottomButton) {
      content = <View style={[styles.bottomButton, isSkip && { backgroundColor: 'transparent' }]}>{content}</View>;
      style = styles.bottomButtonContainer;
    }
    return (
      <View style={style}>
        <TouchableOpacity onPress={onPress} style={this.props.bottomButton && styles.flexOne}>
          {content}
        </TouchableOpacity>
      </View>
    )
  }

  _renderNextButton = () => {
    let content = this.props.renderNextButton ? this.props.renderNextButton() : <Text style={styles.buttonText}>{this.props.nextLabel}</Text>;
    return this._renderButton(content, this._onNextPress);
  }

  _renderDoneButton = () => {
    let content = this.props.renderDoneButton ? this.props.renderDoneButton() : <Text style={styles.buttonText}>{this.props.doneLabel}</Text>;
    return this._renderButton(content, this.props.onDone && this.props.onDone);
  }

  _renderSkipButton = () => {
    let content = this.props.renderSkipButton ? this.props.renderSkipButton() : <Text style={styles.buttonText}>{this.props.skipLabel}</Text>;
    return this._renderButton(content, this.props.onSkip && this.props.onSkip, true);
  }

  _renderPagination = () => {
    // if (this.props.slides.length <= 1) return null;
    const isLastSlide = this.state.activeIndex === (this.props.slides.length - 1 );

    const skipBtn = !isLastSlide && this.props.showSkipButton && this._renderSkipButton();
    const btn = isLastSlide ? this._renderDoneButton() : this._renderNextButton();

    return (
      <View style={styles.paginationContainer}>
        <View style={styles.paginationDots}>
          {!this.props.bottomButton && skipBtn}
          {this.props.slides.length > 1 && this.props.slides.map((_, i) => (
            <View
              key={i}
              style={[
                { backgroundColor: i === this.state.activeIndex ? this.props.activeDotColor : this.props.dotColor },
                styles.dot,
              ]}
            />
          ))}
          {!this.props.bottomButton && btn}
        </View>
        {this.props.bottomButton && btn}
        {this.props.bottomButton && skipBtn}
      </View>
    )
  }

  _onMomentumScrollEnd = (e) => {
    const offset = e.nativeEvent.contentOffset.x;
    // Touching very very quickly and continuous brings about
    // a variation close to - but not quite - the width.
    // That's why we round the number.
    // Also, Android phones and their weird numbers
    const newIndex = Math.round(offset / this.state.width);
    if (newIndex === this.state.activeIndex) {
      // No page change, don't do anything
      return;
    }
    const lastIndex = this.state.activeIndex;
    this.setState({ activeIndex: newIndex });
    this.props.onSlideChange && this.props.onSlideChange(newIndex, lastIndex);
  }

  _getItemLayout = (data, index: number) => ({
    length: this.state.width,
    offset: this.state.width * index,
    index,
  })

  _onLayout = () => {
    const { width, height } = Dimensions.get('window');
    if (width !== this.state.width || height !== this.state.height) {
      // Set new width to update rendering of pages
      this.setState({ width, height });
      // Set new scroll position
      const func = () => { this.flatList.scrollToOffset({ offset: this.state.activeIndex * width, animated: false }) }
      Platform.OS === 'android' ? setTimeout(func, 0) : func();
    }
  }

  render() {
    return (
      <View style={styles.flexOne}>
        <FlatList
            {...this._panResponder.panHandlers}
          ref={ref => this.flatList = ref}
          data={this.props.slides}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          bounces={false}
          style={styles.flexOne}
          renderItem={this._renderItem}
          onMomentumScrollEnd={this._onMomentumScrollEnd}
          extraData={this.state.width}
          onLayout={this._onLayout}
          getItemLayout={this._getItemLayout}
        />
        {this._renderPagination()}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  flexOne: {
    flex: 1,
  },
  paginationContainer: {
    position: 'absolute',
    bottom: 16 + (isIphoneX ? 34 : 0),
    left: 0,
    right: 0,
  },
  paginationDots: {
    height: 16,
    margin: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginHorizontal: 4,
  },
  leftButtonContainer: {
    position: 'absolute',
    left: 0,
  },
  rightButtonContainer: {
    position: 'absolute',
    right: 0,
  },
  bottomButtonContainer: {
    height: 44,
    marginHorizontal: 16,
  },
  bottomButton: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, .3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    backgroundColor: 'transparent',
    color: 'white',
    fontSize: 18,
    padding: 16,
  }
});
